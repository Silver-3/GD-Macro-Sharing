window.onload = () => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

    if (!accessToken) return document.getElementById('login').style.display = 'block';

    fetch('https://discord.com/api/users/@me', { headers: { authorization: `${tokenType} ${accessToken}` }})
        .then(result => result.json())
        .then(response => {
            const { id } = response;

            const date = new Date();
            date.setFullYear(date.getFullYear() + 10);

            document.cookie = `userId=${id}; expires=${date.toUTCString()}; path=/`;
            window.location.href = '/submit-macro';
        })
        .catch(console.error)
}