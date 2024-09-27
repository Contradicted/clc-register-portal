import countries from "i18n-iso-countries";
import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import debounce from "lodash.debounce";

// Import the English language support
import countriesEnglish from "i18n-iso-countries/langs/en.json";

// Register the languages you want to use
countries.registerLocale(countriesEnglish);

const PlaceOfBirthInput = ({
  onPlaceSelect,
  className,
  defaultValue,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(defaultValue || "");
  const geocodePlaceRef = useRef(null);

  useEffect(() => {
    geocodePlaceRef.current = debounce(async (input) => {
      if (input.length < 3) return;

      try {
        const response = await axios.get("/api/geocode", {
          params: { q: input },
        });
        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          const countryCode = result.address.country_code.toUpperCase();
          const countryName =
            countries.getName(countryCode, "en", { select: "official" }) ||
            result.address.country;
          onPlaceSelect({
            placeOfBirth: input,
            countryOfBirth: countryName,
            countryCode: countryCode,
            countryName: countryName,
          });
        }
      } catch (error) {
        console.error("Error geocoding place:", error);
      }
    }, 1000);
  }, [onPlaceSelect]);

  const geocodePlace = useCallback((input) => {
    if (geocodePlaceRef.current) {
      geocodePlaceRef.current(input);
    }
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    geocodePlace(newValue);
  };

  return (
    <Input
      {...props}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      className={className}
    />
  );
};

export default PlaceOfBirthInput;
