import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Google ID and access token
      if (account && profile) {
        token.googleId = profile.sub;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add Google ID to session
      if (session.user) {
        session.user.id = token.googleId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
