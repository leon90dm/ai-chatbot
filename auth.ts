import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'

import CredentialsProvider from "next-auth/providers/credentials"


declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // const authResponse = await fetch("/users/login", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(credentials),
        // })

        // if (!authResponse.ok) {
        //   return null
        // }

        // const user = await authResponse.json()

        return {
          id: "1"
        }
      },
    }),
  ],
})

// NextAuth({
//   providers: [GitHub],
//   callbacks: {
//     jwt({ token, profile }) {
//       if (profile) {
//         token.id = profile.id
//         token.image = profile.avatar_url || profile.picture
//       }
//       return token
//     },
//     session: ({ session, token }) => {
//       if (session?.user && token?.id) {
//         session.user.id = String(token.id)
//       }
//       return session
//     },
//     authorized({ auth }) {
//       return !!auth?.user // this ensures there is a logged in user for -every- request
//     }
//   },
//   pages: {
//     signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
//   }
// })
