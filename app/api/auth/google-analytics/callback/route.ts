import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  console.log('Google Analytics callback received:', { code: !!code, state, error })

  if (error) {
    console.error('Google Analytics OAuth error:', error)
    return new NextResponse(
      `
      <script>
        console.log('Sending error message to parent');
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_ANALYTICS_AUTH_ERROR',
            error: '${error}'
          }, '${NEXT_PUBLIC_APP_URL}');
        }
        window.close();
      </script>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }

  if (!code || !state) {
    console.error('Missing required parameters:', { code: !!code, state: !!state })
    return new NextResponse(
      `
      <script>
        console.log('Missing parameters, sending error to parent');
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_ANALYTICS_AUTH_ERROR',
            error: 'Parâmetros inválidos'
          }, '${NEXT_PUBLIC_APP_URL}');
        }
        window.close();
      </script>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }

  try {
    console.log('Parsing state:', state)
    const { clienteId } = JSON.parse(decodeURIComponent(state))
    console.log('Cliente ID:', clienteId)

    // Trocar código por access token
    console.log('Exchanging code for access token...')
    const tokenResponse = await fetch(`https://oauth2.googleapis.com/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${NEXT_PUBLIC_APP_URL}/api/auth/google-analytics/callback`,
        grant_type: 'authorization_code',
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('Token response:', { success: !tokenData.error, hasToken: !!tokenData.access_token })

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error)
      throw new Error(tokenData.error_description || tokenData.error)
    }

    // Obter informações das contas do Google Analytics
    const accountsResponse = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/accounts`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    const accountsData = await accountsResponse.json()
    
    if (accountsData.error) {
      throw new Error(accountsData.error.message)
    }

    const accounts = accountsData.accounts || []
    const savedAccounts = []

    // Para cada conta, buscar propriedades
    for (const account of accounts) {
      const propertiesResponse = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${account.name}/properties`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      const propertiesData = await propertiesResponse.json()
      const properties = propertiesData.properties || []

      // Salvar cada propriedade como uma conta separada
      for (const property of properties) {
        // Inserir conta de analytics
        const { data: contaAnalytics, error: contaError } = await supabase
          .from("contas_analytics")
          .insert({
            cliente_id: clienteId,
            account_id: account.name.split('/')[1], // Extrair ID da conta
            property_id: property.name.split('/')[1], // Extrair ID da propriedade
            nome_conta: account.displayName,
            nome_propriedade: property.displayName,
            url_site: property.websiteUrl || '',
            status: "ativa",
          })
          .select()
          .single()

        if (contaError) {
          console.error('Error inserting analytics account:', contaError)
          continue
        }

        // Inserir token
        const { error: tokenError } = await supabase.from("tokens_google_analytics").insert({
          conta_analytics_id: contaAnalytics.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          scope: tokenData.scope,
        })

        if (tokenError) {
          console.error('Error inserting token:', tokenError)
          continue
        }

        savedAccounts.push({
          accountId: account.name.split('/')[1],
          accountName: account.displayName,
          propertyId: property.name.split('/')[1],
          propertyName: property.displayName,
          websiteUrl: property.websiteUrl
        })
      }
    }

    console.log('Google Analytics authentication successful, sending success message')
    return new NextResponse(
      `
      <script>
        console.log('Sending success message to parent');
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_ANALYTICS_AUTH_SUCCESS',
            accounts: ${JSON.stringify(savedAccounts)}
          }, '${NEXT_PUBLIC_APP_URL}');
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      </script>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  } catch (error: any) {
    console.error('Google Analytics authentication error:', error)
    return new NextResponse(
      `
      <script>
        console.log('Sending error message to parent:', '${error.message}');
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_ANALYTICS_AUTH_ERROR',
            error: '${error.message}'
          }, '${NEXT_PUBLIC_APP_URL}');
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      </script>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }
}