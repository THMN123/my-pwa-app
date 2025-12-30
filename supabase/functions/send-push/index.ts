import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import webpush from "https://esm.sh/web-push@3.6.7"

serve(async (req) => {
  try {
    const { subscription, title, message } = await req.json()

    // VAPID configuration (SET ONCE)
    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!
    )
    

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body: message
      })
    )

    return new Response(
      JSON.stringify({ sent: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
})
