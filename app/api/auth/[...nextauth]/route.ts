import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        // Check if user exists in our database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!existingUser) {
          // Create a new customer account for them
          const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
          
          let firstName = "Google";
          let lastName = "User";
          if (user.name) {
            const parts = user.name.split(' ');
            firstName = parts[0];
            lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
          }

          await prisma.user.create({
            data: {
              email: user.email,
              password: hashedPassword,
              firstName,
              lastName,
              role: 'CUSTOMER',
            }
          });
        }
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && session.user.email) {
         const dbUser = await prisma.user.findUnique({
           where: { email: session.user.email }
         });
         if (dbUser) {
           (session.user as any).id = dbUser.id;
           (session.user as any).role = dbUser.role;
           (session.user as any).firstName = dbUser.firstName;
           (session.user as any).lastName = dbUser.lastName;
         }
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development",
})

export { handler as GET, handler as POST }
