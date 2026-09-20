import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const authPaths = ["/login", "/register"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  // přihlášený uživatel nemá co dělat na /login nebo /register
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // pouze tyhle cesty vyžadují přihlášení
  const protectedPaths = ["/pridat-nalez", "/profil", "/nastaveni"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // přihlášený uživatel bez username (typicky po OAuth) musí nejdřív doplnit profil
  if (user && request.nextUrl.pathname !== "/complete-profile") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_set_username") // <- tady musí být has_set_username, ne username
      .eq("id", user.sub)
      .single();

    if (!profile?.has_set_username) {
      // <- a tady taky
      const url = request.nextUrl.clone();
      url.pathname = "/complete-profile";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
