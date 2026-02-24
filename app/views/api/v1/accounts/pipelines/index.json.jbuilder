json.array! @pipelines do |pipeline|
  json.partial! 'api/v1/accounts/pipelines/pipeline', formats: [:json], pipeline: pipeline
end
