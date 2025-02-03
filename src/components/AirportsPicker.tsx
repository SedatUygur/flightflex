import { 
  Autocomplete,
  Box, 
  IconButton,
  InputAdornment,
  TextField 
} from "@mui/material";
import { type SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import { MdOutlineLocationOn, MdSwapHoriz, MdTripOrigin } from "react-icons/md";
import type { AirportResult, SearchFlightOptions } from "../types";
import { getNearbyAirports, searchAirport } from "../services/AirScraperService";

type Props = {
  searchData: SearchFlightOptions;
  handleSwapLocations: () => void;
  handleSearchDataChange: (
    key: "destination" | "origin",
  ) => React.Dispatch<React.SetStateAction<AirportResult | null>>;
};

export const AirportsPicker = ({ searchData, handleSwapLocations, handleSearchDataChange }: Props) => {
  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        <Box flex={1}>
          <AirportAutocomplete
            value={searchData.origin}
            icon={
              <InputAdornment position="start" sx={{ marginInlineStart: 0.5 }}>
                <MdTripOrigin size={16} />
              </InputAdornment>
            }
            label="From"
            onChange={handleSearchDataChange("origin")}
            showNearbyAirports
          />
        </Box>
        <Box>
          <IconButton
            onClick={handleSwapLocations}
            sx={{
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <MdSwapHoriz />
          </IconButton>
        </Box>
        <Box flex={1}>
          <AirportAutocomplete
            value={searchData.destination}
            icon={
              <InputAdornment position="start">
                <MdOutlineLocationOn size={28} />
              </InputAdornment>
            }
            label="To"
            onChange={handleSearchDataChange("destination")}
          />
        </Box>
      </Box>
    </>
  );
};
function AirportAutocomplete({
  value,
  icon,
  label,
  onChange,
  showNearbyAirports,
}: {
  value: AirportResult | null;
  icon?: React.ReactNode;
  label: string;
  onChange: (newValue: AirportResult) => void;
  showNearbyAirports?: boolean;
}) {
  const initialRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<AirportResult[]>([]);

  useEffect(() => {
    if (!showNearbyAirports) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { current, nearby } = await getNearbyAirports(position.coords);
      if (initialRender.current) {
        onChange(current);
        initialRender.current = false;
      }
      setOptions(nearby);
    });
  }, [onChange, showNearbyAirports]);

  const handleInput = useCallback((e: React.SyntheticEvent) => {
    setLoading(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const input = e.target as HTMLInputElement;
        const airports = await searchAirport(input.value);
        setOptions(airports);
        timeoutRef.current = null;
      } catch (e) {
        console.error(e);
        // Handle errors gracefully
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  function handleShouldOpen(e: SyntheticEvent) {
    const hasSearchValue = (e.target as HTMLInputElement).value.trim().length > 0;
    setIsOpen(hasSearchValue);
  }

  return (
    <Autocomplete<AirportResult>
      getOptionLabel={(option) => (option ? option.presentation.suggestionTitle : "")}
      onChange={(_e, newValue) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        newValue && onChange(newValue);
        setIsOpen(false);
      }}
      onFocus={handleShouldOpen}
      onBlur={() => setIsOpen(false)}
      open={!loading && isOpen}
      options={options}
      value={value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          onChange={(e) => {
            handleInput(e);
            handleShouldOpen(e);
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: icon,
              endAdornment: null,
            },
          }}
          fullWidth
        />
      )}
    />
  );
}