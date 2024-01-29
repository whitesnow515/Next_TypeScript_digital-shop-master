import TopTitle from "@components/typography/TopTitle";
import CategoryItem from "./category/Item";
import LatestItem from "./category/latestItem";

const TrendingCategory = () => {
      return (
            <div className="bg-primaryBlack-400 flex flex-col px-5 md:px-12 lg:px-[100px] w-full">
                  <div className="bg-[#F0F0F0] flex flex-col gap-8 xl:gap-16 w-full mx-auto px-4 py-10 lg:p-10 xl:p-16 rounded-[40px]">
                        <TopTitle title="BROWSE BY trending categories" style="text-black" />
                        <div className="flex flex-col gap-5 w-full">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-5 lg:gap-5 w-full">
                                    <div className="col-span-1">
                                          <CategoryItem CategoryName="Electronics" url="https://media.discordapp.net/attachments/1012440069300305981/1187960013625495684/test-product.jpg?ex=6598c8fa&is=658653fa&hm=b00d696880a095526ddf5e8085082073601e413e9f031858af4556672d259168&=&format=webp" />
                                    </div>
                                    <div className="col-span-2">
                                          <CategoryItem CategoryName="Formal" url="https://media.discordapp.net/attachments/1012440069300305981/1187959614617161819/d6cbca3c4bbd0057f62646eaebd3fd6c.jpg?ex=6598c89b&is=6586539b&hm=d49fe5ad4aa6c8f546243cb4ebcc3722ef5c0b6fa1e489e7f2fb93053d1de0c1&=&format=webp&width=641&height=534" />
                                    </div>
                                    <div className="col-span-2">
                                          <LatestItem CategoryName="Fashion" url="https://media.discordapp.net/attachments/1012440069300305981/1187959595096883262/82cd85a823c989c1c8631bd976e2cbfb.png?ex=6598c896&is=65865396&hm=5cadefcdf78dd8856409ed1ae49c572616f954fe05179d5fa4b27b906aabec66&=&format=webp&quality=lossless&width=668&height=534" />
                                    </div>
                                    <div className="col-span-1">
                                          <LatestItem CategoryName="Gym" url="https://media.discordapp.net/attachments/1012440069300305981/1187959579334676490/c17a220fe8bfb1126626f3ab58a761ec.png?ex=6598c892&is=65865392&hm=3546dd0bad1e61924a3da68523492201730232bd415c5545c369739bd9ffbd7c&=&format=webp&quality=lossless&width=356&height=534" />
                                    </div>
                              </div>

                        </div>
                  </div>
            </div>
      )
}
export default TrendingCategory;