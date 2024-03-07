import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'

export default function IndexPage() {
  const id = nanoid()
  console.log("chat id", id)
  return <Chat id={id} />
}
