import React from "react";

export default function OAuthButtons() {
  return (
    <div className="space-y-2 mb-5">
      <a
        href="/api/auth/github"
        className="w-full flex items-center justify-center gap-2 bg-[#1b1f27] border border-[#2a3350] rounded-xl py-3 text-sm font-medium hover:bg-[#20242e]"
      >
        <span>🐙</span> Continue with GitHub
      </a>
      <a
        href="/api/auth/google"
        className="w-full flex items-center justify-center gap-2 bg-white text-[#1a1a1a] rounded-xl py-3 text-sm font-medium hover:bg-gray-100"
      >
        <span>🔵</span> Continue with Google
      </a>
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px bg-[#212a45] flex-1" />
        <span className="text-[10px] text-gray-500">OR</span>
        <div className="h-px bg-[#212a45] flex-1" />
      </div>
    </div>
  );
}
