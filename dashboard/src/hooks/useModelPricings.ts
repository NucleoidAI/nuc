import http from "@canmingir/link/platform/http";
import useApi from "./useApi";

export type ModelPricing = {
  id: string;
  provider: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  createdAt: string;
};

function useModelPricings() {
  const { Api } = useApi();

  const getPricings = () => {
    const { data, loading, error, fetch } = Api(
      () => http.get("/model-pricings"),
      []
    );

    return {
      pricings: (data as ModelPricing[]) ?? [],
      loading,
      error,
      fetch,
    };
  };

  const upsertPricing = async (pricing: {
    provider: string;
    model: string;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
  }) => {
    const response = await http.post("/model-pricings", pricing);
    return response?.data;
  };

  const deletePricing = async (pricingId: string) => {
    await http.delete(`/model-pricings/${pricingId}`);
  };

  return { getPricings, upsertPricing, deletePricing };
}

export default useModelPricings;
