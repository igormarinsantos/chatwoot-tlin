class Captain::Tools::SendFileTool < Captain::Tools::BasePublicTool
  description 'Send a file attachment to the user from the assistant context. Use this ONLY when the user explicitly requests a file that is present in the context.'
  param :file_id, type: 'integer', desc: 'The ID of the file to send'
  param :custom_message, type: 'string', desc: 'Optional message to send along with the file'

  def perform(tool_context, file_id:, custom_message: nil)
    conversation = find_conversation(tool_context.state)
    return 'Conversation not found' unless conversation

    file = @assistant.captain_files.find_by(id: file_id)
    return 'File not found' unless file
    return 'File has no attachment' unless file.file.attached?

    log_tool_usage('send_file', { conversation_id: conversation.id, file_id: file.id })
    create_message_with_attachment(conversation, file, custom_message)

    'File sent successfully'
  end

  private

  def create_message_with_attachment(conversation, file, custom_message)
    content = custom_message.presence || "Here is the file you requested: #{file.name}"
    
    message = conversation.messages.build(
      account: @assistant.account,
      inbox: conversation.inbox,
      sender: @assistant,
      message_type: :outgoing,
      content: content
    )

    # Attach the file from ActiveStorage
    message.attachments.build(
      account_id: message.account_id,
      file_type: :file,
      file: file.file.blob
    )

    message.save!
  end

  def permissions
    %w[conversation_manage conversation_unassigned_manage conversation_participating_manage]
  end
end
