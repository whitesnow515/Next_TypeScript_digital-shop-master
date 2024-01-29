import React from "react";

import AppWrapper from "@components/AppWrapper";
import { Meta } from "@components/templates/Meta";
import { AppConfig } from "@util/AppConfig";

const tos = () => {
  return (
    <AppWrapper>
      <Meta title={`TOS`} description={"Terms of Service"} />
      <div className="w-full flex justify-center">
        <div className="text-white w-[calc(80vw)] text-center">
          <h1 className="text-5xl underline text-white">
            Terms of Service
          </h1>
          <p className="my-10">
            Welcome to {AppConfig.site_name} Shop, where we are committed to
            providing high-quality products and exceptional customer service.
            Please read the following Terms of Service (TOS) carefully before
            making any purchases.
          </p>

          <div className="mb-10">
            <h1 className="text-3xl text-white">Warranty</h1>
            <p>
              All products purchased from {AppConfig.site_name} Shop come with a
              24-hour 24-hour warranty unless otherwise specified on the product
              page. page. experience any issues with the product within 24 hours
              of receiving it, please contact us immediately for an replacement
              or credit. Any defects or malfunctions discovered after 24 hours
              will not be covered under warranty.
            </p>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl text-white">Refunds</h1>
            <p>
              We do not offer refunds for products. We do however issue
              replacements or credit if they are damaged or defective upon
              arrival. If your product arrives damaged or defective, please
              contact support within 24 hours of receiving it to arrange for a
              replacement.
            </p>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl text-white">Product Descriptions</h1>
            <p>
              We strive to provide accurate and detailed descriptions of our
              products on the product pages. If you have any questions or
              concerns about a product, please contact us before making a
              purchase. We cannot be held responsible for any misunderstandings
              or incorrect assumptions about a product based on the product
              description.
            </p>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl text-white">Customer Service</h1>
            <p>
              We take pride in providing excellent customer service. If you have
              any questions or concerns about your order or our products, please
              do not hesitate to contact us. We will do our best to respond to
              all inquiries as soon as possible.
            </p>
          </div>

          <p className="mb-20">
            Thank you for choosing {AppConfig.title} Shop.
          </p>
        </div>
      </div>
    </AppWrapper>
  );
};

export default tos;
