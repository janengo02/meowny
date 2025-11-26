import { useMemo } from 'react';
import { ChipAutocomplete } from '../../../shared/components/ChipAutocomplete';
import { useUpdateBucketMutation } from '../api/bucketApi';
import {
  useGetBucketLocationsQuery,
  useCreateBucketLocationMutation,
} from '../api/bucketLocationApi';

interface BucketLocationSelectProps {
  bucketId: number;
  value: number | null;
  disabled?: boolean;
}

export function BucketLocationSelect({
  bucketId,
  value,
  disabled = false,
}: BucketLocationSelectProps) {
  const { data: locations = [] } = useGetBucketLocationsQuery();
  const [updateBucket, { isLoading: isUpdating }] = useUpdateBucketMutation();
  const [
    createLocation,
    { isLoading: isCreating, data: newlyCreatedLocation },
  ] = useCreateBucketLocationMutation();

  const handleLocationChange = async (locationId: string | null) => {
    try {
      await updateBucket({
        id: bucketId,
        params: { bucket_location_id: locationId ? Number(locationId) : null },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update bucket location:', error);
    }
  };

  const handleCreateLocation = async (name: string) => {
    try {
      const newLocation = await createLocation({ name }).unwrap();
      if (newLocation) {
        await updateBucket({
          id: bucketId,
          params: { bucket_location_id: newLocation.id },
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  // Include the newly created location in options if it's not yet in the cached list
  const options = useMemo(() => {
    const locationOptions = locations.map((loc) => ({
      value: loc.id.toString(),
      label: loc.name,
    }));

    // If we just created a location and it's not in the list yet, add it temporarily
    if (
      newlyCreatedLocation &&
      !locations.find((loc) => loc.id === newlyCreatedLocation.id)
    ) {
      locationOptions.push({
        value: newlyCreatedLocation.id.toString(),
        label: newlyCreatedLocation.name,
      });
    }

    return locationOptions;
  }, [locations, newlyCreatedLocation]);

  return (
    <ChipAutocomplete
      value={value?.toString() ?? null}
      options={options}
      onChange={handleLocationChange}
      onCreate={handleCreateLocation}
      label="Location"
      placeholder="Search locations..."
      variant="outlined"
      disabled={disabled || isUpdating || isCreating}
    />
  );
}
