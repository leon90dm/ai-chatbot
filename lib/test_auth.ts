import Providers from "next-auth/providers";
import { Credentials } from "next-auth/providers";

export const TestAuthProvider =  Providers.Credentials({
    // 在这里定义provider的名称
    name: 'Credentials',
    // 'credentials' 是一个函数，它接收请求并返回用户对象
    credentials: {
      username: { label: "Username", type: "text", placeholder: "jsmith" },
      password: {  label: "Password", type: "password" }
    },
    authorize: async (credentials) => {
      // 在此区域添加你自己的验证逻辑
      // 你可以从数据库或其他数据源查询用户
      // 如果用户被验证，则返回用户对象，否则返回null
      const user = { id: 1, name: 'test', email: 'test@example.com' }
  
      if (user) {
        return Promise.resolve(user)
      } else {
        return Promise.resolve(null)
      }
    }
  })