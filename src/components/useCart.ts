import React from "react";
import {useCart} from "react-use-cart";
import useSWR from "swr";

const fetcher = (url:string) => fetch(url ,{
    credentials: 'include'
}).then(r => r.json())

export default function useCartItems() {
    const {
        isEmpty,
        totalUniqueItems,
        items,
        updateItemQuantity,
        setCartMetadata,
        removeItem,
        emptyCart,
        updateItem
    } = useCart();
    const { data, error, isLoading } = useSWR(items.length >0 ? `/api/cart/?products=${items.map(x => x.id).join(",")}` : null, fetcher)
      {/* @ts-ignore */}
    React.useEffect(() => {

        if (!data) {

            return () => {
                setCartMetadata({
                    messages: []
                })
            }
        }
        var messages = []
        if (!data || !Array.isArray(data.results)) {
            console.error("data.results is undefined or not an array");
        } else {
            for (var item of items) {
                let foundItem = data.results.find((x:any) => x.id === item.id)

                if (!foundItem) {
                    removeItem(item.id)
                    messages.push(`"${item.name}" has been removed from your cart due to going out of stock`)
                    continue
                }
                var upd = false;
                if (foundItem.maximum&& item.quantity as any > foundItem.quantity) {
                    updateItemQuantity(item.id, foundItem.minimum ? foundItem.minimum : 1)
                    upd = true
                }
                if (foundItem.price !== item.price) {
                    item.price = foundItem.price;
                    updateItem(item.id, item)
                    upd = true
                }
                if (foundItem.name !== item.name) {
                    item.name = foundItem.name;
                    updateItem(item.id, item)
                    upd = true
                }
                if (upd && !messages.includes(`Some of the items in your cart have been updated`)) {
                    messages.push(`Some of the items in your cart have been updated`)

                }

            }
        }
        setCartMetadata({
            messages: messages
        })
    }, [data])
}