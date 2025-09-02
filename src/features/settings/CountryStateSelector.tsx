import React, { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useGetCountriesQuery } from '../../services/CountryServices';

const CountryStateSelector: React.FC<CountryStateSelectorProps> = ({
  selectedCountry,
  selectedState,
  onCountryChange,
  onStateChange,
  disabled = false,
  required = false,
  className = '',
  label = { country: 'Country', state: 'State/Province' }
}) => {
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  // Fetch countries from API
  const {
    data: countriesResponse,
    isLoading: isLoadingCountries,
    error: countriesError,
    refetch: refetchCountries
  } = useGetCountriesQuery(
    { page: 1, limit: 250, search: '' },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
    }
  );

  const countries = countriesResponse?.data?.countries || [];

  // Get selected country object - FIXED: using code2 instead of code
  const selectedCountryObj = countries.find((c: any) => c.code2 === selectedCountry);
  
  // Get states for selected country
  const availableStates = selectedCountryObj?.states || [];

  // Filter countries based on search - FIXED: checking both code2 and code3
  const filteredCountries = countries.filter((country: any) =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
    country.code2?.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
    country.code3?.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  // Filter states based on search
  const filteredStates = availableStates.filter((state: any) =>
    state.name.toLowerCase().includes(stateSearchTerm.toLowerCase()) ||
    (state.code && state.code.toLowerCase().includes(stateSearchTerm.toLowerCase()))
  );

  // Handle country selection - FIXED: using code2
  const handleCountrySelect = (country: any) => {
    onCountryChange(country.code2, country.name);
    setShowCountryDropdown(false);
    setCountrySearchTerm('');
    
    // Reset state selection when country changes
    if (selectedState) {
      onStateChange('', '');
    }
  };

  // Handle state selection - FIXED: using state.code as key
  const handleStateSelect = (state: any) => {
    onStateChange(state.code || state.name, state.name);
    setShowStateDropdown(false);
    setStateSearchTerm('');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCountryDropdown(false);
      setShowStateDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle retry for failed requests
  const handleRetry = () => {
    refetchCountries();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error State */}
      {countriesError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Failed to load countries</span>
          </div>
          <p className="text-sm text-red-600 mb-2">
            {(countriesError as any)?.data?.message || 'Please check your connection and try again.'}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-800 underline"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      )}

      {/* Country Dropdown */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          {label.country} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!disabled && !isLoadingCountries && !countriesError) {
                setShowCountryDropdown(!showCountryDropdown);
                setShowStateDropdown(false);
              }
            }}
            disabled={disabled || isLoadingCountries || !!countriesError}
            className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm ${
              disabled || isLoadingCountries || countriesError
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-white text-gray-900 hover:border-gray-400'
            } ${selectedCountry ? 'border-gray-300' : 'border-gray-300'}`}
          >
            <div className="flex items-center justify-between">
              <span className={selectedCountryObj ? 'text-gray-900' : 'text-gray-500'}>
                {isLoadingCountries ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading countries...
                  </span>
                ) : countriesError ? (
                  'Error loading countries'
                ) : selectedCountryObj ? (
                  `${selectedCountryObj.name} (${selectedCountryObj.code2})`
                ) : (
                  'Select country'
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showCountryDropdown && !isLoadingCountries && !countriesError && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearchTerm}
                    onChange={(e) => setCountrySearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#129990] focus:border-[#129990]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Country list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country: any) => (
                    <button
                      key={country._id}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                        selectedCountry === country.code2 ? 'bg-[#129990] text-white hover:bg-[#0f7a73]' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{country.name}</span>
                        <span className={`text-xs ${selectedCountry === country.code2 ? 'text-teal-200' : 'text-gray-500'}`}>
                          {country.code2}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {countrySearchTerm ? 'No countries found' : 'No countries available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State Dropdown */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label.state} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (!disabled && selectedCountryObj && availableStates.length > 0) {
                setShowStateDropdown(!showStateDropdown);
                setShowCountryDropdown(false);
              }
            }}
            disabled={disabled || !selectedCountryObj || availableStates.length === 0}
            className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:ring-[#129990] focus:border-[#129990] text-sm ${
              disabled || !selectedCountryObj || availableStates.length === 0
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-white text-gray-900 hover:border-gray-400'
            } ${selectedState ? 'border-gray-300' : 'border-gray-300'}`}
          >
            <div className="flex items-center justify-between">
              <span className={selectedState ? 'text-gray-900' : 'text-gray-500'}>
                {!selectedCountryObj ? (
                  'Select country first'
                ) : availableStates.length === 0 ? (
                  'No states available'
                ) : selectedState ? (
                  availableStates.find((s: any) => (s.code || s.name) === selectedState)?.name || 'Invalid state'
                ) : (
                  'Select state/province'
                )}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showStateDropdown && selectedCountryObj && availableStates.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
              {/* Search input */}
              {availableStates.length > 5 && (
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search states..."
                      value={stateSearchTerm}
                      onChange={(e) => setStateSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#129990] focus:border-[#129990]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}

              {/* State list */}
              <div className="max-h-48 overflow-y-auto">
                {filteredStates.length > 0 ? (
                  filteredStates.map((state: any, index: number) => (
                    <button
                      key={state.code || `${state.name}-${index}`}
                      type="button"
                      onClick={() => handleStateSelect(state)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                        selectedState === (state.code || state.name) ? 'bg-[#129990] text-white hover:bg-[#0f7a73]' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{state.name}</span>
                        {state.code && (
                          <span className={`text-xs ${selectedState === (state.code || state.name) ? 'text-teal-200' : 'text-gray-500'}`}>
                            {state.code}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {stateSearchTerm ? 'No states found' : 'No states available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryStateSelector;