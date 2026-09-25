"use client";

import { useState } from "react";
import Image from "next/image";
import { Blobatar } from "blobatar/react";

type ProfileLike = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
};

type UserAvatarProps = {
  profile?: ProfileLike | null;
  size: number; // px, pro kvalitu obrázku
  className?: string; // rozměry, zaoblení, border
  eager?: boolean;
};

export default function UserAvatar({
  profile,
  size,
  className = "",
}: UserAvatarProps) {
  // URL, která se nepodařila načíst (po jejím změně se zkusí znovu)
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const shell = `overflow-hidden bg-clip-padding ${className}`;

  // profil se ještě nenačetl
  if (!profile?.id) {
    return <div className={`${shell} bg-stone-300 dark:bg-slate-700`} />;
  }

  const alt = profile.username ?? "Profilová fotka";
  const photoUrl = profile.avatar_url;
  const showPhoto = !!photoUrl && photoUrl !== failedUrl;

  return (
    <div className={`${shell} bg-emerald-100 dark:bg-slate-800`}>
      {showPhoto ? (
        <Image
          src={photoUrl}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(photoUrl)}
        />
      ) : (
        <Blobatar
          name={profile.id}
          alt={alt}
          size={size}
          tone={0.75}
          className="w-full h-full"
        />
      )}
    </div>
  );
}