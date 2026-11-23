import { reactive, shallowRef } from 'vue'
import { uploadDocument } from '@/api/upload'
import { formatApiError } from '@/utils/apiErrors'

export function useCompanyDocumentsUpload({ signal }) {
  const enviandoDocumentos = shallowRef(false)
  const documentKeys = reactive({
    articlesOfAssociation: '',
    stateOperatingLicense: '',
    certificateOfGoodStading: '',
  })

  // Documentos já enviados (por campo): evita reenviar e duplicar arquivos a cada tentativa.
  const arquivosEnviados = {}

  async function enviarDocumento(campo, arquivo, descricao) {
    if (arquivosEnviados[campo] !== arquivo) {
      const { data } = await uploadDocument(arquivo, descricao, { signal })
      if (signal.aborted) return
      documentKeys[campo] = data.attachment_key
      arquivosEnviados[campo] = arquivo
    }
  }

  async function uploadAllDocuments({ files, tradeName }) {
    enviandoDocumentos.value = true
    try {
      const resultados = await Promise.allSettled([
        enviarDocumento('articlesOfAssociation', files.articlesOfAssociation.file, `Contrato social de ${tradeName}`),
        enviarDocumento('stateOperatingLicense', files.stateOperatingLicense.file, `Licença de operação de ${tradeName}`),
        enviarDocumento('certificateOfGoodStading', files.certificateOfGoodStading.file, `Certidões negativas de ${tradeName}`),
      ])
      if (signal.aborted) return { ok: false, error: '' }
      const falha = resultados.find((resultado) => resultado.status === 'rejected')
      if (falha) throw falha.reason
      return { ok: true, error: '' }
    } catch (error) {
      if (signal.aborted) return { ok: false, error: '' }
      return {
        ok: false,
        error: formatApiError(error, 'Não foi possível enviar os documentos. Verifique se todos são PDFs válidos.'),
      }
    } finally {
      if (!signal.aborted) enviandoDocumentos.value = false
    }
  }

  return {
    enviandoDocumentos,
    documentKeys,
    uploadAllDocuments,
  }
}
