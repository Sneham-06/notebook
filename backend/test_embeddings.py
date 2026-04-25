try:
    from langchain_huggingface import HuggingFaceEmbeddings
    print("langchain_huggingface imported successfully")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    print("Embeddings initialized")
except Exception as e:
    print(f"Error: {e}")
