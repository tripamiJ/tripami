import axios from "axios";

export const getAutocomplete = async (input: string) => {
  try {
    const {data} = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=country|locality&key=AIzaSyCHa9fvj6VVDQ72LewHeYIm_O6Vsra1R6E`);

    return data;
  } catch (err) {
    console.log('[ERROR getting autocomplete] => ', err);
  }
};
