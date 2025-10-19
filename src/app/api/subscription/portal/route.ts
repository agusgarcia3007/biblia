import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req: NextRequest) => {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    // Get user's subscription to find their customer ID
    // Using any to bypass type checking for dynamic table operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscription } = await (supabase as any)
      .from("subscriptions")
      .select("polar_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.polar_subscription_id) {
      throw new Error("No active subscription found");
    }

    // Get subscription details from Polar to find customer ID
    const subResponse = await fetch(
      `https://api.polar.sh/v1/subscriptions/${subscription.polar_subscription_id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        },
      }
    );

    if (!subResponse.ok) {
      throw new Error("Failed to fetch subscription from Polar");
    }

    const subData = await subResponse.json();
    const customerId = subData.customer_id;

    if (!customerId) {
      throw new Error("Customer ID not found in subscription");
    }

    return customerId;
  },
  server: "production",
});
