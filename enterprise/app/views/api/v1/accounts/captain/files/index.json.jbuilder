json.payload do
  json.array! @files do |file_record|
    json.partial! 'api/v1/models/captain/file', formats: [:json], resource: file_record
  end
end

json.meta do
  json.total_count @files_count
  json.page @current_page
end
