const SUPABASE_URL = 'https://lejphwsfwbhbrdjbthyg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uG0ErJxp4ZCBYOmm-dAX4Q_VXpnoDY5';
const PUBLIC_VAPID_KEY = 'BGIreaSN2c3NN0oYCelxkOGXc63w0GFw3W7DVoUe_EptTgvw92DG0tokQkUkLc_wYrJeLm8ENKcMM5_PyrQnypw';

const supabase = lib.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("SW Live"));
}

// 2. USER: REQUEST PERMISSION & SUBSCRIBE
async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    
    // Request permission from user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return alert("We need permission to send pop-ups!");

    // Create Push Subscription
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    // Save to Supabase (We store it so Admin can find it later)
    const { error } = await supabase.from('push_subscriptions').upsert({
        subscription_json: subscription
    });

    if (!error) alert("Pop-up notifications enabled!");
}

// 3. ADMIN: TRIGGER NOTIFICATION
async function notifyUser(userId, itemName) {
    // 1. Get the user's subscription from DB
    const { data: subData } = await supabase
        .from('push_subscriptions')
        .select('subscription_json')
        .eq('id', userId)
        .single();

    if (!subData) return console.error("User not subscribed to push.");

    // 2. Call the Supabase Edge Function to send the notification
    const { data, error } = await supabase.functions.invoke('send-push', {
        body: {
            subscription: subData.subscription_json,
            title: "Order Ready! ✅",
            message: `Your order for ${itemName} is complete.`
        }
    });

    if (error) console.error("Push failed:", error);
}

// HELPER: Convert VAPID key to required format
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}