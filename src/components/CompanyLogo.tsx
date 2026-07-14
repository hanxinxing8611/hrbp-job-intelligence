import { getCompanyById } from '@/data/dataApi'

interface Props {
  companyId: string
  size?: number
}

export default function CompanyLogo({ companyId, size = 44 }: Props) {
  const company = getCompanyById(companyId)
  return (
    <span
      className="grid shrink-0 place-items-center rounded font-serif font-bold"
      style={{
        width: size,
        height: size,
        background: `${company.logoColor}1a`,
        color: company.logoColor,
        border: `1px solid ${company.logoColor}40`,
        fontSize: size * 0.42,
      }}
    >
      {company.logoInitial}
    </span>
  )
}
