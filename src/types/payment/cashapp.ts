export type CashAppReceipt = {
  title: string;
  subtitle: string;
  support_title: string;
  support_short_title: string;
  support_subtitle: string;
  support_accessibility_label: string;
  threaded_title: string;
  threaded_subtitle: string;
  threaded_display_date: string;
  preview_title: string;
  long_description: string;
  is_action_required: boolean;
  is_outstanding_request: boolean;
  notes: string;
  is_email_receipt_required: boolean;
  rate_plan: string;
  transaction_id: string;
  status_text: string;
  footer_text: string;
  header_text: string;
  display_instrument: string;
  activity_section: string;
  detail_rows: [
    {
      label: string;
      value: string;
    }
  ];
  detail_row_phrases: string[];
  status_treatment: string;
  amount_treatment: string;
  amount_treatment_activity_list: string;
  amount_formatted_activity_list: string;
  amount_formatted: string;
  details_view_content: {
    rows: string[];
  };
  header_subtext: string;
  more_info_sheet_status_text: string;
  more_info_sheet_header_icon: string;
  more_info_sheet_header_icon_treatment: string;
  avatar: {
    image_url: string;
    initial: string;
    accent_color: string;
    colorize_image: boolean;
  };
  is_bitcoin_transaction: boolean;
};
