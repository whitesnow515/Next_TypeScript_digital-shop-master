import { ArrowRightIcon } from "@components/ui/icon"

const MarkIndicator = ({ title, onClick }: { title: string, onClick?: () => void }) => {
      return (
            <div className="flex items-center gap-1 text-base">
                  <span className="text-[#FFFFFF99] font-normal cursor-pointer" onClick={onClick}>{title}</span>
                  <ArrowRightIcon />
            </div>
      )
}

export default MarkIndicator