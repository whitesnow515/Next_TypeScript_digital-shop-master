import Product from "../../../../public/assets/images/test-product.jpg"
const CategoryItem = ({ CategoryName,url }: { CategoryName: string, url?: string }) => {
      return (
            <div className="flex flex-col gap-2 bg-white rounded-[20px] w-full">
                  <span className="text-black font-bold text-4xl pt-5 px-9">
                        {CategoryName}
                  </span>
                  <img alt="product-category" src={url} className="h-[220px] object-cover rounded-b-[20px]" />
            </div>
      )
}

export default CategoryItem;