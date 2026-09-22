"use client";

import { useActionState, useState } from "react";

type ActionState = { error: string | null };

type EditProfileFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  username: string;
  displayName: string | null;
  bio: string | null;
};

const BIO_LIMIT = 150;
const DISPLAY_NAME_LIMIT = 30;
const DANGEROUS_CHARS_REGEX =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064]/;

const initialState: ActionState = { error: null };

export default function EditProfileForm({
  action,
  username,
  displayName,
  bio,
}: EditProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialState
  );

  const initialDisplayName = displayName ?? "";
  const initialBio = bio ?? "";

  const [displayNameValue, setDisplayNameValue] = useState(initialDisplayName);
  const [bioValue, setBioValue] = useState(initialBio);

  const isDirty =
    displayNameValue !== initialDisplayName || bioValue !== initialBio;

  const hasDangerousChars = DANGEROUS_CHARS_REGEX.test(displayNameValue);

  return (
    <form action={formAction} className="mt-4 space-y-5 ">
      <div className="space-y-1.5">
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Zobrazované jméno
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          value={displayNameValue}
          onChange={(e) => setDisplayNameValue(e.target.value)}
          placeholder={username}
          maxLength={DISPLAY_NAME_LIMIT}
          className="w-full rounded-xl border border-stone-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {hasDangerousChars ? (
          <p className="text-xs text-red-500">
            Jméno obsahuje nepovolené neviditelné znaky.
          </p>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Pokud necháš prázdné, zobrazí se tvoje uživatelské jméno.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            O mně
          </label>
          <span
            className={`text-xs ${
              bioValue.length >= BIO_LIMIT
                ? "text-red-500"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {bioValue.length}/{BIO_LIMIT}
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={bioValue}
          onChange={(e) => setBioValue(e.target.value)}
          maxLength={BIO_LIMIT}
          placeholder="Pár slov o tobě..."
          className="w-full rounded-xl border border-stone-200 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      {state.error && (
        <p className="text-xs text-red-500 text-center">{state.error}</p>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={!isDirty || hasDangerousChars || isPending}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 w-sm"
        >
          {isPending ? "Ukládám..." : "Uložit"}
        </button>
      </div>
    </form>
  );
}