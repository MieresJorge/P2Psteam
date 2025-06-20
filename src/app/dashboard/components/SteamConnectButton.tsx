'use client';

import { Button } from "@/components/ui/button";

export default function SteamConnectButton() {
  const handleSteamConnect = () => {
    // Construimos la URL de retorno a nuestra futura API route.
    const returnToUrl = `${window.location.origin}/api/auth/steam/callback`;
    const realm = window.location.origin;

    // Esta es la URL de autenticación OpenID de Steam.
    const steamLoginUrl = `https://steamcommunity.com/openid/login?${new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnToUrl,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    }).toString()}`;

    // Redirigimos al usuario a la página de Steam.
    window.location.href = steamLoginUrl;
  };

  return (
    <Button onClick={handleSteamConnect} className="mt-4">
      Conectar con Steam
    </Button>
  );
}