// Location hierarchy data for provider profiles
// Country -> Cities -> Areas structure

export interface LocationData {
  countries: Country[]
}

export interface Country {
  code: string
  name: string
  flag: string
  cities: City[]
}

export interface City {
  name: string
  areas: string[]
}

export const locationData: LocationData = {
  countries: [
    {
      code: "ZM",
      name: "Zambia",
      flag: "🇿🇲",
      cities: [
        {
          name: "Lusaka",
          areas: [
            "Avondale",
            "Balmoral",
            "Chalala",
            "Chainda",
            "Chelston",
            "Chamba Valley",
            "Chilenje",
            "Chilenje South",
            "Chudleigh",
            "Civic Centre",
            "Cosmopolitan",
            "Emmasdale",
            "Fairview",
            "Garden",
            "Great East Road",
            "Helen Kaunda",
            "Ibex Hill",
            "Jesmondine",
            "Kabwata",
            "Kalingalinga",
            "Kabulonga",
            "Kalundu",
            "Kamwala",
            "Kaunda Square",
            "Kanyama",
            "Lilayi",
            "Libala",
            "Libala South",
            "Longacres",
            "Makeni",
            "Mandevu",
            "Mass Media",
            "Matero",
            "Meanwood",
            "Mtendere",
            "Munali",
            "Ng'ombe",
            "Northmead",
            "Olympic",
            "PHI",
            "Rhodes Park",
            "Roma",
            "Salama Park",
            "Silverest",
            "State Lodge",
            "Sunningdale",
            "Thorn Park",
            "Twin Palm",
            "Woodlands",
            "Zingalume",
          ],
        },
        {
          name: "Kitwe",
          areas: [
            "Buchi",
            "Bulangililo",
            "Chamboli",
            "Chimwemwe",
            "Garneton",
            "Ipusukilo",
            "Kwacha",
            "Luangwa",
            "Mindolo",
            "Miseshi",
            "Mulenga",
            "Nkana East",
            "Nkana West",
            "Parklands",
            "Race Course",
            "Riverside",
            "Wusakile",
          ],
        },
        {
          name: "Ndola",
          areas: [
            "Chifubu",
            "Chipulukusu",
            "Dola Hill",
            "Itawa",
            "Kabushi",
            "Kaloko",
            "Kansenshi",
            "Lubuto",
            "Masala",
            "Mushili",
            "Ndeke",
            "Northrise",
            "Pamodzi",
            "Twapia",
          ],
        },
        {
          name: "Livingstone",
          areas: [
            "Dambwa",
            "Dambwa Central",
            "Dambwa North",
            "Linda",
            "Libuyu",
            "Maramba",
            "Nakatindi",
            "New Town",
            "Railway",
          ],
        },
        {
          name: "Kabwe",
          areas: [
            "Bwacha",
            "Highridge",
            "Katondo",
            "Luangwa",
            "Makululu",
            "Mukobeko",
            "Ndeke",
            "Railway",
            "Town Centre",
          ],
        },
        {
          name: "Chingola",
          areas: [
            "Chiwempala",
            "Kabundi",
            "Kasompe",
            "Lulamba",
            "Nchanga North",
            "Nchanga South",
            "Town Centre",
          ],
        },
        {
          name: "Mufulira",
          areas: [
            "Chibolya",
            "Kankoyo",
            "Kansuswa",
            "Mokambo",
            "Town Centre",
          ],
        },
        {
          name: "Luanshya",
          areas: [
            "Baluba",
            "Fisenge",
            "Mikomfwa",
            "Mpatamatu",
            "Roan",
            "Town Centre",
          ],
        },
        {
          name: "Solwezi",
          areas: [
            "Kapijimpanga",
            "Kyawama",
            "Mushitala",
            "Town Centre",
          ],
        },
        {
          name: "Kasama",
          areas: [
            "Chishimba",
            "Lukashya",
            "Twalumba",
            "Town Centre",
          ],
        },
      ],
    },
    {
      code: "ZA",
      name: "South Africa",
      flag: "🇿🇦",
      cities: [
        {
          name: "Johannesburg",
          areas: ["Sandton", "Rosebank", "Soweto", "Midrand"],
        },
        {
          name: "Cape Town",
          areas: ["City Centre", "Sea Point", "Camps Bay"],
        },
        {
          name: "Durban",
          areas: ["Umhlanga", "Berea", "Westville"],
        },
      ],
    },
    {
      code: "KE",
      name: "Kenya",
      flag: "🇰🇪",
      cities: [
        {
          name: "Nairobi",
          areas: ["Westlands", "Kilimani", "Karen", "Eastleigh"],
        },
        {
          name: "Mombasa",
          areas: ["Nyali", "Bamburi", "Likoni"],
        },
      ],
    },
    {
      code: "TZ",
      name: "Tanzania",
      flag: "🇹🇿",
      cities: [
        {
          name: "Dar es Salaam",
          areas: ["Masaki", "Mikocheni", "Kariakoo"],
        },
        {
          name: "Arusha",
          areas: ["Njiro", "Kaloleni"],
        },
      ],
    },
    {
      code: "UG",
      name: "Uganda",
      flag: "🇺🇬",
      cities: [
        {
          name: "Kampala",
          areas: ["Kololo", "Nakasero", "Ntinda"],
        },
      ],
    },
    {
      code: "ZW",
      name: "Zimbabwe",
      flag: "🇿🇼",
      cities: [
        {
          name: "Harare",
          areas: ["Borrowdale", "Mount Pleasant", "Avondale"],
        },
        {
          name: "Bulawayo",
          areas: ["Hillside", "Suburbs"],
        },
      ],
    },
    {
      code: "MW",
      name: "Malawi",
      flag: "🇲🇼",
      cities: [
        {
          name: "Lilongwe",
          areas: ["Area 3", "Area 10", "Area 47"],
        },
        {
          name: "Blantyre",
          areas: ["Limbe", "Ndirande"],
        },
      ],
    },
    {
      code: "BW",
      name: "Botswana",
      flag: "🇧🇼",
      cities: [
        {
          name: "Gaborone",
          areas: ["Phakalane", "Mogoditshane", "Broadhurst"],
        },
      ],
    },
  ],
}

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
  return locationData.countries.find((c) => c.code === code)
}

export function getCitiesByCountry(countryCode: string): City[] {
  const country = getCountryByCode(countryCode)
  return country?.cities || []
}

export function getAreasByCity(countryCode: string, cityName: string): string[] {
  const cities = getCitiesByCountry(countryCode)
  const city = cities.find((c) => c.name === cityName)
  return city?.areas || []
}

export function formatLocation(country?: string, city?: string, area?: string): string {
  const parts = [area, city, country].filter(Boolean)
  return parts.join(", ")
}
