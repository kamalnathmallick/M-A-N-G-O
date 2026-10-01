"""
CNN Model Architecture Factory for Mango Flower Bud Analysis
Supports MobileNetV3, ResNet50, and EfficientNet backbones with transfer learning
and deep feature vector extraction.
"""

from typing import Tuple, Optional
import os

try:
    import torch
    import torch.nn as nn
    from torchvision import models
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class MangoBudCNN(nn.Module if TORCH_AVAILABLE else object):
    """
    Modular CNN for Mango Bud Health Classification and Deep Feature Extraction.
    """
    def __init__(
        self,
        backbone_name: str = "mobilenet_v3_small",
        pretrained: bool = True,
        num_classes: int = 4,
        dropout: float = 0.2
    ):
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required to initialize MangoBudCNN")

        super().__init__()
        self.backbone_name = backbone_name
        self.num_classes = num_classes

        if backbone_name == "mobilenet_v3_small":
            weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
            base = models.mobilenet_v3_small(weights=weights)
            in_features = base.classifier[0].out_features if hasattr(base.classifier[0], 'out_features') else 1024
            self.feature_extractor = base.features
            self.avgpool = base.avgpool
            self.feature_dim = base.classifier[0].in_features
            # Custom Classifier Head
            self.classifier = nn.Sequential(
                nn.Linear(self.feature_dim, 256),
                nn.Hardswish(),
                nn.Dropout(p=dropout),
                nn.Linear(256, num_classes)
            )

        elif backbone_name == "resnet50":
            weights = models.ResNet50_Weights.DEFAULT if pretrained else None
            base = models.resnet50(weights=weights)
            self.feature_dim = base.fc.in_features
            self.feature_extractor = nn.Sequential(*list(base.children())[:-1])
            self.avgpool = nn.Identity()
            self.classifier = nn.Sequential(
                nn.Dropout(p=dropout),
                nn.Linear(self.feature_dim, num_classes)
            )

        elif backbone_name == "efficientnet_b0":
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
            base = models.efficientnet_b0(weights=weights)
            self.feature_extractor = base.features
            self.avgpool = base.avgpool
            self.feature_dim = base.classifier[1].in_features
            self.classifier = nn.Sequential(
                nn.Dropout(p=dropout),
                nn.Linear(self.feature_dim, num_classes)
            )
        else:
            raise ValueError(f"Unsupported backbone: {backbone_name}")

    def extract_features(self, x: "torch.Tensor") -> "torch.Tensor":
        """
        Extract penultimate dense feature representation for fusion with climate vectors.
        """
        feats = self.feature_extractor(x)
        pooled = self.avgpool(feats)
        flattened = torch.flatten(pooled, 1)
        return flattened

    def forward(self, x: "torch.Tensor") -> Tuple["torch.Tensor", "torch.Tensor"]:
        """
        Forward pass returning both class logits and deep features.
        """
        features = self.extract_features(x)
        logits = self.classifier(features)
        return logits, features


def build_model(
    config: Optional[dict] = None,
    checkpoint_path: Optional[str] = None,
    device: str = "cpu"
):
    """
    Factory helper to instantiate and configure CNN model.
    """
    if not TORCH_AVAILABLE:
        return None

    cfg = config or {}
    backbone = cfg.get("backbone", "mobilenet_v3_small")
    num_classes = cfg.get("num_classes", 4)
    pretrained = cfg.get("pretrained", True)
    dropout = cfg.get("dropout", 0.2)

    model = MangoBudCNN(
        backbone_name=backbone,
        pretrained=pretrained,
        num_classes=num_classes,
        dropout=dropout
    )

    if checkpoint_path and os.path.exists(checkpoint_path):
        state_dict = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"[MangoBudCNN] Loaded checkpoint from {checkpoint_path}")

    model.to(device)
    return model
