const TopTitle = ({ title, style }: { title: string, style?: string }) => {
      return (
            <span className={`text-3xl xl:text-4xl text-center ${style??"text-white"} font-black capitalize`}>
                  {title}
            </span>
      )
}

export default TopTitle;