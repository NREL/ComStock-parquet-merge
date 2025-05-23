import type { AsyncBuffer } from 'hyparquet'
import { asyncBufferFromUrl, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { render } from 'preact'
import { useState } from 'preact/hooks'
import { allColumns, allUpgrades } from './columns'
import { convertToCsv, downloadCsv } from './downloadCsv'
import { countyLookup, stateLookup } from './geo'
import { personas } from './personas'
import { onInput, onInputMultiple } from './utils'
import './style.css'

const { SNAPPY, ZSTD } = compressors

const sortedStates = Object.entries(stateLookup).sort(([, stateA], [, stateB]) => stateA.localeCompare(stateB))

export function ParquetMerge() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [useCase, setUseCase] = useState('')
  const [persona, setPersona] = useState('')

  const [states, setStates] = useState<string[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [columns, setColumns] = useState<string[]>(allColumns)
  const [upgrades, setUpgrades] = useState<string[]>([])

  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState<[number, number] | null>(null)

  const nestedCounties = () => {
    const nested: Record<string, string[]> = {}
    for (const county of counties) {
      for (const stateFips of states) {
        if (county in countyLookup[stateFips]) {
          nested[stateFips] ??= []
          nested[stateFips].push(county)
          break
        }
      }
    }
    return nested
  }

  const downloadDisabled = () =>
    isDownloading ||
    [firstName, lastName, email, useCase, persona].some((field) => !field.trim().length) ||
    [states, counties, columns, upgrades].some((list) => !list.length)

  const submitUserQuery = async () => {
    const selectedCounties = Object.entries(nestedCounties()).flatMap(([stateFips, countyIds]) =>
      countyIds.map((countyId) => `${countyLookup[stateFips][countyId]} (${countyId})`),
    )

    try {
      await fetch('https://prod-55.usgovtexas.logic.azure.us:443/workflows/8b47d4fb1f41411781ec7836210884f8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=65ao8WvmFQE5KtK39j2ni_FSANzTt_MUb9JHVQHbwnw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'First Name': firstName,
          'Last Name': lastName,
          Email: email,
          'Use Case': useCase,
          Persona: persona,
          'Selected States': states.map((stateFips) => stateLookup[stateFips]).join(', '),
          'Selected Counties': selectedCounties.join(', '),
          'Selected Datasets': upgrades.join(', '),
          Timestamp: new Date().toISOString(),
        }),
      })
    } catch (err) {
      console.error(err)
    }
  }

  const download = async () => {
    setIsDownloading(true)

    await submitUserQuery()

    const nested = nestedCounties()

    const urlGroups: { county: string; url: string }[][] = states.flatMap((stateFips) => {
      const state = stateLookup[stateFips]
      return nested[stateFips].map((county) =>
        ['baseline', ...upgrades].map((upgrade) => ({
          county: countyLookup[stateFips][county],
          url: `https://oedi-data-lake.s3.amazonaws.com/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/comstock_amy2018_release_2/metadata_and_annual_results_aggregates/by_state_and_county/full/parquet/state%3D${state}/county%3D${county}/${state}_${county}_${upgrade}_agg.parquet`,
        })),
      )
    })

    let completed = 0
    const totalUrls = urlGroups.flat().length
    setProgress([completed, totalUrls])

    const data = []
    for (const { county, url } of urlGroups.flat()) {
      let file: AsyncBuffer
      try {
        file = await asyncBufferFromUrl({ url })
      } catch (err) {
        setProgress([++completed, totalUrls])
        continue
      }

      const withCountyName = columns.includes('in.county_name')
      const datum = await parquetReadObjects({
        file,
        compressors: { SNAPPY, ZSTD },
        columns: columns.filter((column) => column !== 'in.county_name'),
      })
      data.push(...datum.map((obj) => (withCountyName ? { ...obj, 'in.county_name': county } : obj)))

      setProgress([++completed, totalUrls])
    }
    if (data.length > 0) {
      downloadCsv(convertToCsv(data, columns), 'Merged Data.csv')
    }

    setProgress(null)
    setIsDownloading(false)
  }

  return (
    <div class="flex flex-col items-start gap-3">
      <fieldset class="inline-flex gap-3">
        <legend>User Info</legend>

        <div class="flex flex-col gap-3">
          <div class="flex gap-3">
            <input type="text" placeholder="First Name *" autoComplete="given-name" required value={firstName} onInput={onInput(setFirstName)} />
            <input type="text" placeholder="Last Name *" autoComplete="family-name" required value={lastName} onInput={onInput(setLastName)} />
          </div>
          <input type="email" placeholder="Email *" autoComplete="email" required value={email} onInput={onInput(setEmail)} />
          <textarea placeholder="Use Case *" class="resize-none" required value={useCase} onInput={onInput(setUseCase)}></textarea>
          <select required value={persona} onChange={onInput(setPersona)}>
            <option value="" disabled>
              Select Persona *
            </option>
            {personas.map((persona) => (
              <option key={persona} value={persona}>
                {persona}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      <fieldset class="inline-flex">
        <legend>Data Selection</legend>

        <div class="flex h-100 gap-3">
          <select multiple required onChange={onInputMultiple(setStates)}>
            <option disabled value="">
              Select states
            </option>
            {sortedStates.map(([fips, state]) => (
              <option key={fips} value={fips} selected={states.includes(fips)}>
                {state}
              </option>
            ))}
          </select>

          <select multiple required class="min-w-50" onChange={onInputMultiple(setCounties)}>
            <option disabled value="">
              Select counties
            </option>
            {states.map((stateFips) => (
              <>
                <option disabled class="mt-3 mb-1 flex h-8 items-center justify-center rounded-md bg-gray-500 font-medium text-white">
                  {stateLookup[stateFips]}
                </option>
                {Object.entries(countyLookup[stateFips]).map(([id, county]) => (
                  <option key={id} value={id} selected={counties.includes(id)}>
                    {county}
                  </option>
                ))}
              </>
            ))}
          </select>

          <select multiple required onChange={onInputMultiple(setColumns)}>
            <option disabled value="">
              Select columns
            </option>
            {allColumns.map((column) => (
              <option key={column} value={column} selected={columns.includes(column)}>
                {column}
              </option>
            ))}
          </select>

          <select multiple required onChange={onInputMultiple(setUpgrades)}>
            <option disabled value="">
              Select upgrades
            </option>
            {allUpgrades.map((upgrade) => (
              <option key={upgrade} value={upgrade} selected={upgrades.includes(upgrade)}>
                {upgrade}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <button disabled={downloadDisabled()} onClick={download}>
        {progress ? `Downloading ${progress[0] + 1}/${progress[1]} ...` : 'Download'}
      </button>
    </div>
  )
}

render(<ParquetMerge />, document.getElementById('parquet-merge'))
