import { AssetBrowser } from "../asset-browser";
import { ModalOverlay } from "./modal-overlay";

interface Props {
  handleClose: () => void;
  handleAsset: (asset: AssetType) => void;
}

export const AssetsModal = ({ handleClose, handleAsset }: Props) => {
  const handleClick = (item: AssetType) => {
    handleAsset(item);
  };

  return (
    <ModalOverlay onClose={handleClose}>
      <AssetBrowser onItemClick={handleClick} />
    </ModalOverlay>
  );
};
