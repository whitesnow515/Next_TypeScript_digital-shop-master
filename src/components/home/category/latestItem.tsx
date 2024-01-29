import Product from "../../../../public/assets/images/test-product.jpg"
const LatestItem = ({ CategoryName,url }: { CategoryName: string, url?: string }) => {
      return (
            <div className="flex bg-white rounded-[20px] w-full relative">
                  <span className="absolute top-7 left-9 text-black text-4xl font-bold">{CategoryName}</span>
                  <img alt="product" src={url} className="object-cover w-full h-[289px] rounded-[20px]" />
            </div>
      )
}

export default LatestItem;