const CODE_LENGTH = 4
const CODE_PREFIX = 'CB-'
const READABLE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const UINT32_RANGE = 0x1_0000_0000

type RandomInteger = (maximumExclusive: number) => number

/** Generates short public card codes without ambiguous characters. */
export class PublicCodeGenerator {
  readonly #randomInteger: RandomInteger

  /**
   * Creates a generator with an injectable cryptographic random source.
   *
   * @param randomInteger - Function returning an integer below the given bound.
   */
  constructor(randomInteger: RandomInteger = cryptoRandomInteger) {
    this.#randomInteger = randomInteger
  }

  /** Generates one code in the `CB-XXXX` format. */
  generate(): string {
    let suffix = ''

    for (let index = 0; index < CODE_LENGTH; index += 1) {
      suffix += READABLE_ALPHABET[this.#randomInteger(READABLE_ALPHABET.length)]
    }

    return `${CODE_PREFIX}${suffix}`
  }
}

/**
 * Returns an unbiased cryptographically random integer.
 *
 * @param maximumExclusive - Upper bound excluded from possible results.
 */
function cryptoRandomInteger(maximumExclusive: number): number {
  const rejectionLimit =
    Math.floor(UINT32_RANGE / maximumExclusive) * maximumExclusive
  const values = new Uint32Array(1)
  let value: number

  do {
    crypto.getRandomValues(values)
    value = values[0]
  } while (value >= rejectionLimit)

  return value % maximumExclusive
}
