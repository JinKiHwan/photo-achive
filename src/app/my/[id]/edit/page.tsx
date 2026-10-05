import { MemberEditor } from "@/components/admin/MemberEditor";
export default async function EditMemberSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemberEditor key={id} id={id} />;
}
