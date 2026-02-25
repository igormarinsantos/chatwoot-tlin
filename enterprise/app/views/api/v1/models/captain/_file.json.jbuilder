json.id resource.id
json.name resource.name
json.description resource.description
json.assistant_id resource.assistant_id
json.file_url url_for(resource.file) if resource.file.attached?
json.created_at resource.created_at.to_i
json.updated_at resource.updated_at.to_i
