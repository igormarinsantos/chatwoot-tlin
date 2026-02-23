module Booking
  class ExpireHoldsJob < ApplicationJob
    queue_as :default

    def perform
      Booking::HoldManager.cleanup_expired_holds!
    end
  end
end
