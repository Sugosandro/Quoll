// Global JSX type declarations for @google/model-viewer custom element
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': {
      src?: string
      alt?: string
      poster?: string
      'auto-rotate'?: string
      'camera-controls'?: string
      ar?: string
      'shadow-intensity'?: string
      exposure?: string
      style?: { [key: string]: string | number | undefined }
      class?: string
      id?: string
      [key: string]: unknown
    }
  }
}
