import Link from "next/link";
import { membershipEnabled, POLICY_VERSION, serviceInfo } from "@/lib/community-config";
export function LegalDocument({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="mx-auto max-w-3xl rounded-xl bg-zinc-950/90 px-6 py-12 space-y-6 text-sm leading-7">
    <Link href="/" className="text-zinc-400 underline">사진 둘러보기</Link>
    <h1 className="text-3xl text-white">{title}</h1>
    <p className="text-zinc-400">{serviceInfo.name} · 문서 버전 {POLICY_VERSION}</p>
    {!membershipEnabled && <p className="rounded-lg border border-amber-800 bg-zinc-950 p-4 text-amber-200">공개 전 검토용 초안입니다. 운영자 정보, 실제 저장·처리 지역과 보관 정책을 확정한 뒤 회원 서비스를 엽니다.</p>}
    {children}
    <section><h2 className="text-lg font-semibold">운영자 및 문의</h2><p>운영자: {serviceInfo.operator || "공개 전 확정 예정"}</p><p>개인정보 보호 담당 및 문의: {serviceInfo.contact ? <a href={`mailto:${serviceInfo.contact}`} className="underline">{serviceInfo.contact}</a> : "공개 전 확정 예정"}</p></section>
    <div className="flex gap-6 underline"><Link href="/terms">이용약관</Link><Link href="/privacy">개인정보처리방침</Link></div>
  </article>;
}
