import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '1405602787157576'
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'a8235b9c13118f4ff02afe36315feead'
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  console.log('Facebook callback received:', { code: !!code, state, error })

  if (error) {
    console.error('Facebook OAuth error:', error)
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(error)}&platform=meta`)
  }

  if (!code || !state) {
    console.error('Missing required parameters:', { code: !!code, state: !!state })
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent('invalid_request')}&platform=meta`)
  }

  try {
    console.log('Parsing state:', state)
    const { clienteId } = JSON.parse(decodeURIComponent(state))
    console.log('Cliente ID:', clienteId)

    // Trocar código por access token
    console.log('Exchanging code for access token...')
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: `${NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token response:', { success: !tokenData.error, hasToken: !!tokenData.access_token })

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error)
      throw new Error(tokenData.error.message)
    }

    // Obter informações da conta
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}`,
    )
    const accountData = await accountResponse.json()

    if (accountData.error) {
      throw new Error(accountData.error.message)
    }

    // Salvar contas e tokens no Supabase
    for (const account of accountData.data) {
      // Inserir conta de anúncios
      const { data: contaAds, error: contaError } = await supabase
        .from("contas_ads")
        .insert({
          cliente_id: clienteId,
          plataforma: "meta",
          conta_id: account.id,
          nome_conta: account.name,
          status: "ativa",
        })
        .select()
        .single()

      if (contaError) throw contaError

      // Inserir token
      const { error: tokenError } = await supabase.from("tokens_meta").insert({
        conta_ads_id: contaAds.id,
        access_token: tokenData.access_token,
        token_type: "user_access_token",
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      })

      if (tokenError) throw tokenError
    }

    console.log('Facebook authentication successful, redirecting back to app')
    // Redirecionar de volta para a aplicação com sucesso
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/dashboard?success=true&platform=meta&accounts=${encodeURIComponent(JSON.stringify(accountData.data))}`)
  } catch (error: any) {
    console.error('Facebook authentication error:', error)
    // Redirecionar de volta para a aplicação com erro
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(error.message)}&platform=meta`)
  }
}
