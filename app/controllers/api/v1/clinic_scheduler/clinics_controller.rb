module Api
  module V1
    module ClinicScheduler
      class ClinicsController < BaseController
        def availability
          professional = clinic.professionals.find(params[:professional_id])
          procedure = clinic.procedures.find(params[:procedure_id])
          from = Date.parse(params[:from]) rescue Date.today
          to = Date.parse(params[:to]) rescue 7.days.from_now.to_date
          
          engine = ::ClinicScheduler::AvailabilityEngine.new(professional, from..to)
          render json: {
            clinic_id: clinic.id,
            professional_id: professional.id,
            procedure_id: procedure.id,
            available_slots: engine.free_slots(procedure.duration_minutes)
          }
        end
      end
    end
  end
end
