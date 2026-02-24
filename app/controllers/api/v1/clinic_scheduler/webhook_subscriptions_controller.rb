module Api
  module V1
    module ClinicScheduler
      class WebhookSubscriptionsController < BaseController
        def create
          subscription = clinic.webhook_subscriptions.new(subscription_params)
          if subscription.save
            render json: subscription, status: :created
          else
            render json: { errors: subscription.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def subscription_params
          params.require(:subscription).permit(:target_url, events: [])
        end
      end
    end
  end
end
