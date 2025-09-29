import { defineStore } from 'pinia'
import {
  fetchPersons,
  fetchPerson,
  createPerson,
  updatePerson,
  deletePerson,
} from '@/services/persons'

export const usePersonsStore = defineStore('persons', {
  state: () => ({
    persons: [], // List of all persons
    currentPerson: null, // Currently selected person
    isLoading: false, // Loading state
    error: null, // Error messages

    // Filters and search for persons only
    searchQuery: '',
    filters: {
      side: '', // Filter by person side preference
      sortBy: 'name', // Sort by: name, height, weight, created_at
    },
  }),

  getters: {
    // Get filtered and sorted persons
    filteredPersons: (state) => {
      let filtered = [...state.persons]

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (person) =>
            person.name?.toLowerCase().includes(query) ||
            (person.phone && person.phone.includes(query)),
        )
      }

      // Apply side filter
      if (state.filters.side) {
        filtered = filtered.filter((person) => person.side === parseInt(state.filters.side))
      }

      // Apply sorting
      return filtered.sort((a, b) => {
        switch (state.filters.sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'height':
            return (b.height || 0) - (a.height || 0)
          case 'weight':
            return (b.weight || 0) - (a.weight || 0)
          case 'created_at':
            return new Date(b.created_at || 0) - new Date(a.created_at || 0)
          default:
            return 0
        }
      })
    },

    // Get person by ID
    getPersonById: (state) => (id) => {
      return state.persons.find((person) => person.id === id)
    },

    // Statistics
    personsCount: (state) => state.persons.length,

    // Get persons by side
    bothSidePersons: (state) => state.persons.filter((p) => p.side === 0),
    leftSidePersons: (state) => state.persons.filter((p) => p.side === 1),
    rightSidePersons: (state) => state.persons.filter((p) => p.side === 2),
  },

  actions: {
    // Fetch all persons
    async fetchPersons() {
      this.isLoading = true
      this.error = null

      try {
        console.log('Fetching all persons from Person API...')
        const persons = await fetchPersons()
        this.persons = persons
        console.log('Persons loaded:', this.persons.length)
      } catch (error) {
        console.error('Failed to fetch persons:', error)
        this.error = 'Failed to load persons. Please check your connection and try again.'
      } finally {
        this.isLoading = false
      }
    },

    // Fetch single person
    async fetchPerson(id) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Fetching person ${id} from Person API...`)

        const existingPerson = this.getPersonById(id)
        if (existingPerson) {
          this.currentPerson = existingPerson
          this.isLoading = false
          return existingPerson
        }

        const person = await fetchPerson(id)
        this.currentPerson = person

        if (person) {
          console.log('Person loaded:', person.name)
          return person
        } else {
          throw new Error('Person not found')
        }
      } catch (error) {
        console.error('Failed to fetch person:', error)
        this.error =
          error.response?.status === 404 ? 'Person not found' : 'Failed to load person details.'
        this.currentPerson = null
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Create new person
    async createPerson(personData) {
      this.isLoading = true
      this.error = null

      try {
        console.log('Creating person via Person API:', personData.name)
        const newPerson = await createPerson(personData)
        this.persons.push(newPerson)
        console.log('Person created:', newPerson.name)
        return { success: true, person: newPerson }
      } catch (error) {
        console.error('Failed to create person:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to create person'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Update person
    async updatePerson(id, personData) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Updating person ${id} via Person API...`)
        const updatedPerson = await updatePerson(id, personData)

        // Update in persons list
        const personIndex = this.persons.findIndex((p) => p.id === id)
        if (personIndex !== -1) {
          this.persons[personIndex] = updatedPerson
        }

        // Update current person if it's the same
        if (this.currentPerson?.id === id) {
          this.currentPerson = updatedPerson
        }

        console.log('Person updated:', updatedPerson.name)
        return { success: true, person: updatedPerson }
      } catch (error) {
        console.error('Failed to update person:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to update person'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Delete person
    async deletePerson(id) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Deleting person ${id} via Person API...`)
        await deletePerson(id)

        const personIndex = this.persons.findIndex((p) => p.id === id)
        if (personIndex !== -1) {
          const personName = this.persons[personIndex].name
          this.persons.splice(personIndex, 1)
          console.log('Person deleted:', personName)
        }

        // Clear current person if it's the deleted one
        if (this.currentPerson?.id === id) {
          this.currentPerson = null
        }

        return { success: true }
      } catch (error) {
        console.error('Failed to delete person:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to delete person'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Set search query
    setSearchQuery(query) {
      this.searchQuery = query || ''
    },

    // Update filters
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },

    // Clear search and filters
    clearFilters() {
      this.searchQuery = ''
      this.filters = {
        side: '',
        sortBy: 'name',
      }
    },

    // Clear error message
    clearError() {
      this.error = null
    },

    // Reset store to initial state
    resetStore() {
      this.persons = []
      this.currentPerson = null
      this.isLoading = false
      this.error = null
      this.searchQuery = ''
      this.filters = {
        side: '',
        sortBy: 'name',
      }
    },
  },
})
