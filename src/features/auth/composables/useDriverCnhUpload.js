import { reactive, shallowRef } from 'vue'
import { uploadDocument } from '@/api/upload'
import { formatApiError } from '@/utils/apiErrors'

export function useDriverCnhUpload({ signal, errorMessage, getDriverName }) {
  const cnhAttachmentKey = shallowRef('')
  const enviandoDocumento = shallowRef(false)
  const cnh = reactive({ file: null, name: '' })
  // Arquivo da CNH já enviado: evita reenviar (e duplicar) a cada clique em "Continuar".
  let cnhArquivoEnviado = null

  async function ensureCnhUploaded() {
    errorMessage.value = ''
    enviandoDocumento.value = true
    try {
      if (!cnh.file) {
        cnhAttachmentKey.value = ''
        cnhArquivoEnviado = null
      } else if (cnhArquivoEnviado !== cnh.file) {
        const { data } = await uploadDocument(cnh.file, `CNH de ${getDriverName().trim()}`, { signal })
        if (signal.aborted) return false
        cnhAttachmentKey.value = data.attachment_key
        cnhArquivoEnviado = cnh.file
      }
      return true
    } catch (error) {
      if (!signal.aborted) {
        errorMessage.value = formatApiError(
          error,
          'Não foi possível enviar o arquivo da CNH. Verifique se é um PDF válido.',
        )
      }
      return false
    } finally {
      if (!signal.aborted) enviandoDocumento.value = false
    }
  }

  return { cnh, cnhAttachmentKey, enviandoDocumento, ensureCnhUploaded }
}
