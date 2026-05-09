const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const returnUrl = params.get('state') || '/';

if (!code) {
    window.location.href = '/sign-in';
} else {
    fetch('/api/auth/callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) window.location.href = decodeURIComponent(returnUrl);
            else console.log("[ERROR] Login failed:", data.error);
        })
        .catch(err => console.log("[ERROR] Auth Error:", err));
}