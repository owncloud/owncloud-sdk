import Shares from '../src/shareManagement.js'

jest.mock('../src/xmlParser', () => ({
  xml2js: (data) => ({ ocs: data })
}))

describe('shareManagement', () => {
  describe('shareFileWithLink', () => {
    it('creates a quicklink which is ocis and oc10 compliant', async () => {
      const mr = jest.fn(async function () {
        return { body: arguments[3] }
      })
      const shares = new Shares({ _makeOCSrequest: mr, _normalizePath: jest.fn(p => p) })

      await shares.shareFileWithLink('/any', { quicklink: true })
      expect(mr.mock.calls[0][3].quicklink).toBe(true)
      expect(mr.mock.calls[0][3].attributes.length).toBe(1)
      expect(mr.mock.calls[0][3].attributes[0].key).toBe('isQuickLink')
      expect(mr.mock.calls[0][3].attributes[0].scope).toBe('files_sharing')
      expect(mr.mock.calls[0][3].attributes[0].value).toBe(true)

      await shares.shareFileWithLink('/any', { quicklink: false })
      expect(mr.mock.calls[1][3].quicklink).toBeUndefined()
      expect(mr.mock.calls[1][3].attributes).toBeUndefined()

      await shares.shareFileWithLink('/any', {
        quicklink: true,
        attributes: [{ key: 'isQuickLink', scope: 'files_sharing', value: true }]
      })
      expect(mr.mock.calls[2][3].quicklink).toBe(true)
      expect(mr.mock.calls[2][3].attributes.length).toBe(1)
      expect(mr.mock.calls[2][3].attributes[0].key).toBe('isQuickLink')
      expect(mr.mock.calls[2][3].attributes[0].scope).toBe('files_sharing')
      expect(mr.mock.calls[2][3].attributes[0].value).toBe(true)

      await shares.shareFileWithLink('/any', {
        quicklink: true,
        attributes: [{ key: 'other', scope: 'files_sharing', value: true }]
      })
      expect(mr.mock.calls[3][3].quicklink).toBe(true)
      expect(mr.mock.calls[3][3].attributes.length).toBe(2)
      expect(mr.mock.calls[3][3].attributes[0].key).toBe('other')
      expect(mr.mock.calls[3][3].attributes[1].key).toBe('isQuickLink')
      expect(mr.mock.calls[3][3].attributes[1].scope).toBe('files_sharing')
      expect(mr.mock.calls[3][3].attributes[1].value).toBe(true)

      await shares.shareFileWithLink('/any', {
        quicklink: true,
        attributes: [
          { key: 'key_1', scope: 'scope_1', value: true },
          { key: 'key_2', scope: 'scope_2', value: true },
          { key: 'key_3', scope: 'scope_3', value: true },
          { key: 'key_4', scope: 'scope_4', value: true },
          { key: 'key_5', scope: 'scope_5', value: true }
        ]
      })
      expect(mr.mock.calls[4][3].attributes.length).toBe(6)

      await shares.shareFileWithLink('/any', {
        quicklink: true,
        attributes: [
          { key: 'key_1', scope: 'scope_1', value: true },
          { key: 'key_2', scope: 'scope_2', value: true },
          { key: 'key_3', scope: 'scope_3', value: true },
          { key: 'isQuickLink', scope: 'files_sharing', value: false },
          { key: 'key_5', scope: 'scope_5', value: true }
        ]
      })
      expect(mr.mock.calls[5][3].attributes.length).toBe(5)
      expect(mr.mock.calls[5][3].attributes[4].key).toBe('isQuickLink')
      expect(mr.mock.calls[5][3].attributes[4].scope).toBe('files_sharing')
      expect(mr.mock.calls[5][3].attributes[4].value).toBe(true)
    })
  })
})
