import { redirect } from 'next/navigation'

export default function StudentIndexPage({ params }: { params: { id: string } }) {
  redirect(`/students/${params.id}/profile`)
}
